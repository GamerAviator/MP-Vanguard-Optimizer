Gamer Aviator’s Vanguard Capture 1.0
MIGHTY PARTY VANGUARD CAPTURE — 0.1.8

ONE-CLICK EXTRACTION
1. Open Mighty Party in the Chrome profile that holds the player you want.
2. Open Vanguard Capture and click Extract this account.
3. The extension starts clean and reloads the game. Wait for normal game load.
4. Your VCEF automatically downloads as vanguard-PLAYER-DATE.vcef. The popup
   may close during reload; the background capture/download continues.
5. In the optimizer, choose/create the matching player account, go to Import
   → Import VCEF capture, choose that download, review/select values,
   and apply. Capturing/exporting never changes optimizer accounts directly.

One click handles game extraction and download. Optimizer import retains its
review screen. A browser setting that asks where downloads go may still show
its usual file-save prompt. Unknown IDs, duplicate names or missing balances
stop automatic export and leave data available for manual review/export.
If no profile arrives, reopening the popup after a minute shows retry guidance.

INSTALL / UPDATE IN EACH CHROME PROFILE
1. Extract chrome-vanguard to a permanent folder.
2. Switch to the desired Chrome profile using Chrome's profile selector.
3. Open chrome://extensions and enable Developer mode.
4. New profile: Load unpacked → choose chrome-vanguard (the extension folder).
   Existing profile: replace its extension files and click Reload on its card.
5. Repeat for other profiles. You can select the same permanent folder in each
   profile. Chrome extension storage remains separate for each profile.
6. Pin Vanguard Capture using Chrome's Extensions menu.

Version 0.1.7 adds the downloads permission to save the extracted VCEF
without keeping the popup open. Allow it if Chrome requests confirmation.
It does not upload data, click game upgrades, or alter game requests.

MULTIPLE PLAYERS
Always open the correct player's game tab BEFORE clicking Extract this account.
Each run replaces only that tab's extension capture and creates a new download
with an account label. Duplicate filenames are uniquified, not overwritten.
Don't switch game players during an extraction. After a completed download,
the capture stops. For another player, switch profiles/tab and extract again.

Chrome profiles have separate extension/local optimizer storage. An installed
optimizer may also use its own separate storage. Importing into the selected
optimizer account changes only checked values; it does not replace your other
accounts. Verify the selected account and source label on every import.
Back up optimizer accounts routinely. Keep personal VCEFs off public GitHub.

FIELDS
Known GuildWarUnits IDs are linked to the 50-card canonical map; no screen
positions are used. Captured config metadata can verify sprite, faction,
attack type and rarity. Unknown/new IDs require explicit review/mapping.
The game config has sprite keys rather than English display names.

GuildUnitsBit.data.UnitLevels supplies Vanguard levels. Four exact upgrade
balances are GuildSpheres (Purple Essence), GuildOrder, GuildNature and
GuildChaos. GuildRoulettePoints supplies SOVs (Seals of Valor), separately
tracked in the optimizer; SOVs do not increase its upgrade budget.
Verified ticket mappings: RegattaPoints → Regatta Tickets;
GuildFogPvpShopResource → Chariot Tickets. Both are exported in manual and
one-click captures when valid balances are present. Missing/invalid fields
are omitted, not replaced with zero. Review ticket balances during import.

MANUAL / TROUBLESHOOTING
Expand Manual capture & troubleshooting for Start fresh capture, Stop and
Read cached unit config. Start fresh capture requires a manual game refresh.
Review detected names/levels, Select matched roster, then Export checked data.
A cache scan reads only GuildWarUnits files from the existing /idbfs FILE_DATA
store using readonly transactions. It never clears or changes that cache.
Export capture diagnostics for troubleshooting. They omit complete profiles,
request headers/bodies and credentials, but contain private roster information.

Responses from documents predating the one-click reload are ignored. Downloads
use the just-captured profile's levels/resources rather than merged older tab
state. All 111 automated tests passed, including multi-account isolation and
one-download behavior. This new automation still needs a live Chrome check.
The existing optimizer/SOV update works with this extension: no new app files
are required for one-click extraction.

0.1.10: Pyro (ID 51, Order Ranged) and Viryel (ID 52, Nature Ranged)
are now automatically recognized. Previously, these unmatched IDs prevented
one-click VCEF downloads and required manual review. Existing 50 mappings
remain unchanged. Their sprite names are not yet verified; cached config
checks still validate faction, attack type and rarity for these two cards.
Unknown IDs and mismatched known metadata still require review.

UPDATE: Unzip and replace your extension folder, open chrome://extensions,
click Reload on Mighty Party Vanguard Capture, then click Extract this account
from the game tab. This reloads the game and downloads a fresh capture.

Toolbar badge: a dot while reading, a check when saved, or ! when review is
needed. Numeric roster/response counts are no longer displayed on the toolbar
or popup status. Manual Stop clears the activity badge. Diagnostics remain
available for troubleshooting.

0.1.11: Vanguard shield icons replace Chrome's generic letter icon.
Game profile IDs are included in captures when explicit profile_id/profileId
fields are present in the profile response. Generic id fields are never guessed.
An optional numeric profile-ID field is available before extraction if the game
does not supply one. It applies to that extraction only and is cleared afterward.
A detected ID that disagrees with the entered ID blocks automatic download.
Captured ID and filename help distinguish accounts even after player renames.
The optimizer links IDs to its existing local accounts; it never replaces their
local UUIDs or history. Review and confirm a first link, then future ID-bearing
imports select the matching account automatically. An unrecognized ID cannot
be applied to an account already linked to a different ID. Older captures that
lack profile IDs still require manual account verification.

0.1.13: Simplified popup. Normal use is Extract this account, then import
the downloaded VCEF in the optimizer. Manual ID entry and capture controls
are under Troubleshooting. Manual card review and diagnostic exports have
their own nested sections. No selection is needed in the extension for a
normal automatic download; choose what to apply in the optimizer.

0.1.13: Chrome-style rounded popup with system light/dark colors. Downloads
use .vcef (Vanguard Capture Extractor File). The optimizer still accepts older captures
captures. The underlying capture schema and review safeguards are unchanged.

1.0: Continuous popup background with no inset frame or outer padding.
New captures use .vcef. Install by replacing your existing extension folder,
then click Reload on chrome://extensions.

1.0.1: During an active extraction, the extension checks the visible game
for the known green launch-screen Play artwork and tries one canvas click.
Keep the game tab active and visible. If Play remains, click it manually.
The visual check processes temporary tab pixels locally in memory; no screen
images are saved, exported or sent to a server. No additional permissions.
The game may reject synthetic input; manual Play always remains available.
