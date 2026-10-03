# Resource provenance

`battlefield.png`, `cao-cao.png`, and `units.png` were newly generated for this project using the image generation tool, guided by the project's original concept art. They are not extracted from the original Cao Cao game. The troop atlas contains eight prototype poses, not a finished multi-direction animation set.

The bundled font subsets are Noto Sans KR and Noto Serif KR. They were obtained from Google Fonts for the characters used in this prototype and are self-hosted so the game does not contact a font service during play.

- Noto CJK source: https://github.com/notofonts/noto-cjk
- Font licenses: `fonts/Sans-LICENSE.txt` and `fonts/Serif-LICENSE.txt` (SIL Open Font License 1.1)
- Font subset files are TrueType (`.ttf`), regular/medium/semibold/bold.

When adding dialogue with new characters, expand the subsets or supply a complete compatible font. The existing CSS includes system serif and sans-serif fallback families.
