# Resource provenance

The following images were newly generated for this project using the image generation tool, guided by the project's original concept art. They are not extracted from the original Cao Cao game:

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

The bundled font subsets are Noto Sans KR and Noto Serif KR. They were obtained from Google Fonts for the characters used in this prototype and are self-hosted so the game does not contact a font service during play.

- Noto CJK source: https://github.com/notofonts/noto-cjk
- Font licenses: `fonts/Sans-LICENSE.txt` and `fonts/Serif-LICENSE.txt` (SIL Open Font License 1.1)
- Font subset files are TrueType (`.ttf`), regular/medium/semibold/bold.

When adding dialogue with new characters, expand the subsets or supply a complete compatible font. The existing CSS includes system serif and sans-serif fallback families.
