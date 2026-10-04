"""Rebuild the shipped Noto subsets from official variable TTF source files.

Requires fonttools. Put sans.ttf and serif.ttf in --source-dir; source URLs and
checksums are recorded in public/assets/ATTRIBUTION.md. Normal npm builds use
the committed subsets and do not require Python or a font download.
"""
import argparse
from io import BytesIO
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

parser = argparse.ArgumentParser()
parser.add_argument('--source-dir', required=True, type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
sources = [root / 'index.html', *sorted((root / 'src').glob('*.ts')), *sorted((root / 'src').glob('*.css'))]
characters = set(''.join(path.read_text() for path in sources) + '만억조0123456789,.−◆●▲◇✓▼軍議魏')
unicodes = {ord(character) for character in characters if ord(character) >= 32}
words = {u for u in unicodes if 0xAC00 <= u <= 0xD7A3 or 0x4E00 <= u <= 0x9FFF}

for family in ['sans', 'serif']:
    font = TTFont(args.source_dir / (family + '.ttf'))
    missing = words - font.getBestCmap().keys()
    if missing:
        raise ValueError(f'{family}: source lacks {"".join(map(chr, sorted(missing)))}')
    options = subset.Options()
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=unicodes)
    subsetter.subset(font)
    buffer = BytesIO()
    font.save(buffer)
    for index, weight in enumerate([400, 500, 600, 700]):
        output = root / 'public/assets/fonts' / f'{family}-{index}.ttf'
        static = instantiateVariableFont(TTFont(BytesIO(buffer.getvalue())), {'wght': weight}, inplace=True)
        static.save(output)
        assert not words - TTFont(output).getBestCmap().keys()
        print(f'{output.name}: weight {weight}, {output.stat().st_size} bytes, all {len(words)} Korean/Han characters covered', flush=True)
