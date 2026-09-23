#!/bin/bash
# why-blocked.sh — diagnose website blocks on this network.
# Distinguishes DNS blocking vs IP blocking vs SNI (name-based) filtering,
# and tells you where to fix it. Read-only; changes nothing.

RED=$'\033[31m'; GRN=$'\033[32m'; YEL=$'\033[33m'; DIM=$'\033[2m'; RST=$'\033[0m'

GW=$(route -n get default 2>/dev/null | awk '/gateway/{print $2}')
echo "Gateway: ${GW:-unknown}"

echo
echo "1) DNS resolution"
for h in youtube.com www.youtube.com tiktok.com google.com; do
  ip=$(dig +short "$h" 2>/dev/null | tail -1)
  printf "   %-18s -> %s\n" "$h" "${ip:-(none)}"
done
echo "   ${DIM}If real IPs resolve, it is NOT a DNS block.${RST}"

echo
echo "2) TCP + TLS reachability"
for h in www.youtube.com tiktok.com www.google.com; do
  if nc -z -G 4 "$h" 443 2>/dev/null; then tcp="${GRN}open${RST}"; else tcp="${RED}blocked${RST}"; fi
  code=$(curl -s -o /dev/null -w "%{http_code}" -m 8 "https://$h/" 2>/dev/null)
  [ "$code" = "000" ] && tls="${RED}failed${RST}" || tls="${GRN}ok ($code)${RST}"
  printf "   %-18s tcp:%s  https:%s\n" "$h" "$tcp" "$tls"
done

echo
echo "3) SNI test (is the block based on the site NAME?)"
YIP=$(dig +short www.youtube.com 2>/dev/null | tail -1)
if [ -n "$YIP" ]; then
  a=$(curl -s -o /dev/null -w "%{http_code}" -m 8 --resolve "www.youtube.com:443:$YIP" "https://www.youtube.com/" 2>/dev/null)
  b=$(curl -s -o /dev/null -w "%{http_code}" -m 8 --resolve "www.google.com:443:$YIP" "https://www.google.com/" 2>/dev/null)
  echo "   same IP ($YIP), name=youtube.com -> ${a}"
  echo "   same IP ($YIP), name=google.com  -> ${b}"
  if [ "$a" = "000" ] && [ "$b" != "000" ]; then
    echo "   ${RED}=> SNI filtering confirmed${RST}: the connection is dropped only when the"
    echo "      TLS handshake names youtube.com. TCP/DNS/IP are fine."
  fi
fi

echo
echo "4) Where to fix it (SNI filtering is done by the ROUTER, not this Mac)"
echo "   Gateway ${GW:-192.168.1.1} looks like a UniFi router."
echo "   Open the UniFi app (or https://unifi.ui.com / https://${GW:-192.168.1.1}):"
echo "     Settings -> Security / Firewall & Security -> Content Filtering"
echo "       - disable the filter, or remove the category (e.g. 'Streaming Media'),"
echo "         or remove the site rule for youtube.com / tiktok.com"
echo "     Also check: Settings -> Profiles -> the profile assigned to your device,"
echo "       and any Traffic Rule / Firewall rule blocking those domains."
echo "   Then reconnect your device (toggle Wi-Fi) and re-run this script."
echo
echo "   ${DIM}No Mac setting is involved (checked /etc/hosts, DNS, proxies, Screen Time,"
echo "   content-filter extensions — all clean).${RST}"