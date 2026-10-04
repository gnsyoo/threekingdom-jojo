# Resource provenance

The following images were newly generated for this project using the image generation tool, guided by the project's original concept art. They are not extracted from the original Cao Cao game:

Current Sima Yi campaign (generated 2026-10-04):

- `sima-portraits.png`: original Sima Yi, Sima Shi, Niu Jin (牛金), Guo Huai, Hu Zun, Meng Da, Zhuge Liang, Gongsun Yuan, in a 4×2 portrait atlas.
- `sima-motion.png`: the same eight characters, eight poses per row: four walk and four attack, 64 new frames. The PNG remains unmodified; `sima-motion.json` describes inspected alpha bounds and centered pivots.
- `shangyong-map.png`, `wuzhang-map.png`, `liaodong-map.png`: newly generated Shangyong mountain town, Wuzhang defensive plateau, and Xiangping siege maps. No units or interface lettering are baked into these maps.
- `chronicle-portraits.png`: eight new original portraits (Zhang He, Ma Su, Wang Ping, Wei Yan, Sima Zhao, Cao Shuang, Jiang Wei, Li Sheng), a 1536×1024 4×2 atlas. The generated PNG remains unmodified; SVG clipping preserves each cell’s proportions.
- `jieting-map.svg`, `xicheng-map.svg`, `qishan-map.svg`, `shangfang-map.svg`, `gaoping-map.svg`, `yangping-map.svg`: original deterministic vector terrain art authored in `scripts/build-campaign-maps.ts` from the actual tactical terrain arrays. No commercial map or image was traced or edited. Goal markers and fire are runtime layers.
- New tactical units reuse existing class motion frames where applicable; each new historical character does not have an independent eight-pose sheet.
- General infantry and archers retain 16 frames from `units-walk.png`/`units-attack.png`.

Previously generated Cao Cao campaign artwork, retained as project history:

- `battlefield.png`: tactical battlefield background.
- `sishui.png`, `hulao.png`: new Sishui and Hulao Pass battlefields, based on this project's battlefield style.
- `campaign-portraits.png`: Sun Jian, Hua Xiong, Lü Bu, and a spare alliance officer in a transparent 2×2 atlas.
- `boss-motion.png`: Hua Xiong and mounted Lü Bu, four walk and four attack poses each. These 16 new frames bring the project to 80 motion frames.
- `cao-cao.png`: Cao Cao portrait.
- `units.png`: eight idle troop poses.
- `war-room.png`, `camp.png`: council room and preparation camp backgrounds, without baked-in interface text or controls.
- `portraits.png`: Liu Bei, Guan Yu, Zhang Fei, and a Han officer, arranged in a transparent 2×2 atlas.
- `items.png`: sword, armor, horse, rice, arrows, and medicine, arranged in a transparent 3×2 atlas. The prototype uses the equipment and medicine illustrations.
- `units-walk.png`, `units-attack.png`: eight troop types with four walk poses and four attack poses each, 64 motion frames in total. Horizontal reflection supplies left/right facing; these are not independent four-direction sets.

`unit-motion.json` and `boss-motion.json` contain project-authored source rectangle, foot pivot, and scale metadata for the unmodified motion atlases. `ui/frame.svg` and `ui/ink-paper.svg` are project-authored decorative frame and paper illustrations. Menus, text, health bars, and deployment markers remain live interface elements.

The bundled font subsets are Noto Sans KR and Noto Serif KR. They were rebuilt from the official Google Fonts variable TTFs with 520 Korean/Han characters, covering every character in the current UI and are self-hosted so the game does not contact a font service during play.

- Noto CJK source: https://github.com/notofonts/noto-cjk
- Font licenses: `fonts/Sans-LICENSE.txt` and `fonts/Serif-LICENSE.txt` (SIL Open Font License 1.1)
- Font subset files are TrueType (`.ttf`), regular/medium/semibold/bold.

Sources used on 2026-10-03:

- https://raw.githubusercontent.com/google/fonts/main/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf — SHA-256 `194018e6b2b293a7964f037b25c0249ce1418bc9ab3c971060a03aa57861e252`.
- https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifkr/NotoSerifKR%5Bwght%5D.ttf — SHA-256 `11f8d5de6f1b79195efba3828aaa2ec95c1178f5ae976fb23c8d53250a9938f3`.
- The license files include the corresponding upstream copyright notices and SIL OFL text.

When adding dialogue with new characters, expand the subsets with `scripts/build-font-subsets.py --source-dir <directory>` (requires Python and fonttools; the directory contains the two source files named `sans.ttf` and `serif.ttf`). The script subsets the sources before instantiating weights 400/500/600/700 and verifies coverage. Normal npm builds use the committed files. The existing CSS also includes system serif and sans-serif fallback families.

The UI fits portrait/item atlas rectangles without distorting their aspect ratio. Battle idle poses use the first walk frame, with both width and height capped at 44 world pixels, including weapons, to stay inside a 64-pixel tile. Smooth texture filtering and a canvas density capped at 2 improve scaled rendering; source illustrations remain the generated project artwork listed above.
