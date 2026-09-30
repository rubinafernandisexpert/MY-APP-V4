#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Brio end-to-end smoke test — proves the deployed build actually works.
#
#   BASE=http://127.0.0.1:3010 bash tests/smoke.sh
#
# Covers: health, CSRF enforcement, bad-credential rejection, login with the
# seeded account, protected-page redirect, dashboard render, entitlement claim,
# progress write, analytics rollup, logout.
# Exits non-zero if any check fails.
# ---------------------------------------------------------------------------
set -uo pipefail

BASE="${BASE:-http://127.0.0.1:3010}"
DEMO_EMAIL="${DEMO_EMAIL:-demo@brio.app}"
DEMO_PASSWORD="${DEMO_PASSWORD:-BrioDemo!2026}"

J="$(mktemp -d)"
CK="$J/cookies.txt"
PASS=0; FAIL=0

ok()  { printf '  \033[32mPASS\033[0m %s\n' "$1"; PASS=$((PASS+1)); }
bad() { printf '  \033[31mFAIL\033[0m %s\n' "$1"; FAIL=$((FAIL+1)); }
code(){ curl -s -o /dev/null -w '%{http_code}' "$@"; }

echo "Brio smoke test → $BASE"

# 1. health -----------------------------------------------------------------
H="$(curl -s "$BASE/healthz")"
case "$H" in *'"ok":true'*) ok "GET /healthz returns ok";; *) bad "GET /healthz → $H";; esac

# 2. storefront -------------------------------------------------------------
C="$(code "$BASE/")"
[ "$C" = "200" ] && ok "GET / storefront 200" || bad "GET / → $C"

# 3. csrf token issued ------------------------------------------------------
curl -s -c "$CK" -o "$J/login.html" "$BASE/login"
CSRF="$(awk '/brio_csrf/ {print $7}' "$CK" | tail -1)"
[ -n "$CSRF" ] && ok "sign-in page issues a CSRF cookie" || bad "no brio_csrf cookie"

# 4. POST without a CSRF token is rejected ---------------------------------
C="$(code -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' -d "{\"email\":\"$DEMO_EMAIL\",\"password\":\"$DEMO_PASSWORD\"}")"
[ "$C" = "403" ] && ok "login without CSRF token → 403" || bad "CSRF-less login → $C (expected 403)"

# 5. wrong password ---------------------------------------------------------
C="$(code -b "$CK" -c "$CK" -X POST "$BASE/api/auth/login" -H 'Content-Type: application/json' \
      -H "X-CSRF-Token: $CSRF" -H "Origin: $BASE" -d "{\"email\":\"$DEMO_EMAIL\",\"password\":\"definitely-wrong\"}")"
[ "$C" = "401" ] && ok "wrong password → 401" || bad "wrong password → $C (expected 401)"

# 6. protected page redirects anonymous visitors ---------------------------
LOC="$(curl -s -o /dev/null -w '%{redirect_url}' "$BASE/library")"
case "$LOC" in *'/login'*) ok "GET /library anonymous → /login";; *) bad "anonymous /library → '$LOC'";; esac

# 7. login with the seeded account -----------------------------------------
curl -s -b "$CK" -c "$CK" -o "$J/login.json" -X POST "$BASE/api/auth/login" \
  -H 'Content-Type: application/json' -H "X-CSRF-Token: $CSRF" -H "Origin: $BASE" \
  -d "{\"email\":\"$DEMO_EMAIL\",\"password\":\"$DEMO_PASSWORD\"}" >/dev/null
grep -q "$DEMO_EMAIL" "$J/login.json" && ok "seeded account signs in ($DEMO_EMAIL)" \
  || bad "login response: $(head -c 200 "$J/login.json")"
grep -q 'brio_sid' "$CK" && ok "session cookie set" || bad "no session cookie after login"

# 8. identity ---------------------------------------------------------------
curl -s -b "$CK" "$BASE/api/me" > "$J/me.json"
grep -q "$DEMO_EMAIL" "$J/me.json" && ok "GET /api/me identifies the session" || bad "GET /api/me → $(head -c 200 "$J/me.json")"

# 9. the protected dashboard renders ---------------------------------------
C="$(code -b "$CK" "$BASE/library")"
BODY="$(curl -s -b "$CK" "$BASE/library")"
[ "$C" = "200" ] && ok "GET /library (authenticated) 200" || bad "authenticated /library → $C"
case "$BODY" in *'personal library'*) ok "dashboard renders the library heading";; *) bad "dashboard heading missing";; esac
case "$BODY" in *'Reading time'*) ok "dashboard renders the analytics panel";; *) bad "analytics panel missing";; esac

# 10. seeded entitlements ---------------------------------------------------
curl -s -b "$CK" "$BASE/api/library" > "$J/lib.json"
N="$(python3 -c "import json,sys;print(len(json.load(open('$J/lib.json')).get('books',[])))" 2>/dev/null || echo 0)"
[ "$N" -ge 6 ] && ok "seed library holds $N ebooks" || bad "seed library returned $N ebooks (expected >= 6)"

# 11. claim a title the account does not own -------------------------------
TITLE="$(python3 -c "import json;d=json.load(open('$J/lib.json'));own={b['id'] for b in d.get('books',[])};print(next((b['title'] for b in d.get('catalog',[]) if b['id'] not in own),''))" 2>/dev/null)"
if [ -n "$TITLE" ]; then
  python3 - "$TITLE" <<'PY' > "$J/claim.json"
import json,sys
print(json.dumps({"titles":[sys.argv[1]]}))
PY
  C="$(code -b "$CK" -X POST "$BASE/api/library/claim" -H 'Content-Type: application/json' \
        -H "X-CSRF-Token: $CSRF" -H "Origin: $BASE" --data-binary @"$J/claim.json")"
  [ "$C" = "200" ] && ok "POST /api/library/claim → 200" || bad "claim → $C"
  N2="$(curl -s -b "$CK" "$BASE/api/library" | python3 -c "import json,sys;print(len(json.load(sys.stdin).get('books',[])))")"
  [ "$N2" -gt "$N" ] && ok "entitlement granted ($N → $N2 books)" || bad "library did not grow ($N → $N2)"
else
  bad "could not pick an unowned title to claim"
fi

# 12. progress write --------------------------------------------------------
BOOK="$(curl -s -b "$CK" "$BASE/api/library" | python3 -c "import json,sys;print(json.load(sys.stdin)['books'][0]['id'])")"
C="$(code -b "$CK" -X POST "$BASE/api/progress" -H 'Content-Type: application/json' \
      -H "X-CSRF-Token: $CSRF" -H "Origin: $BASE" \
      -d "{\"bookId\":\"$BOOK\",\"minutes\":3,\"percent\":42}")"
[ "$C" = "200" ] && ok "POST /api/progress → 200" || bad "progress → $C"

# 13. reading page + analytics ---------------------------------------------
C="$(code -b "$CK" "$BASE/read/$BOOK")"
[ "$C" = "200" ] && ok "GET /read/$BOOK renders" || bad "GET /read/$BOOK → $C"

curl -s -b "$CK" "$BASE/api/analytics?days=7" > "$J/an.json"
D="$(python3 -c "import json;print(len(json.load(open('$J/an.json')).get('series',[])))" 2>/dev/null || echo 0)"
[ "$D" = "7" ] && ok "GET /api/analytics returns a 7-day series" || bad "analytics series length $D"
python3 - "$J/an.json" <<'PY' >/dev/null 2>&1 && ok "analytics totals are computed from stored events" || bad "analytics totals missing"
import json,sys
t=json.load(open(sys.argv[1]))["totals"]
assert t["booksOwned"] >= 6 and t["minutesAll"] > 0, t
PY

# 14. logout ----------------------------------------------------------------
C="$(code -b "$CK" -c "$CK" -X POST "$BASE/api/auth/logout" -H "X-CSRF-Token: $CSRF" -H "Origin: $BASE")"
[ "$C" = "200" ] && ok "POST /api/auth/logout → 200" || bad "logout → $C"
LOC="$(curl -s -o /dev/null -w '%{redirect_url}' -b "$CK" "$BASE/library")"
case "$LOC" in *'/login'*) ok "session is gone after logout";; *) bad "still authenticated after logout ('$LOC')";; esac

echo
echo "-------------------------------------------"
printf '  %d passed, %d failed\n' "$PASS" "$FAIL"
echo "-------------------------------------------"
rm -rf "$J"
[ "$FAIL" -eq 0 ] || exit 1
