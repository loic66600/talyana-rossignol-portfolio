"""Generate responsive derivatives; originals remain untouched for the lightbox.
Run: python -m pip install Pillow fonttools brotli && python scripts/optimize-media.py
"""
from pathlib import Path
from PIL import Image
from fontTools.ttLib import TTFont
from fontTools import subset
import hashlib, io, json
ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'dist/assets'
OUT = ASSETS / 'responsive'
FONTS = ASSETS / 'fonts'
OUT.mkdir(exist_ok=True); FONTS.mkdir(exist_ok=True)
manifest = {'images': {}, 'posters': {}, 'fonts': {}}
def save_image(im, stem, width, fmt, quality):
    width = min(width, im.width)
    resized = im.resize((width, round(im.height * width / im.width)), Image.Resampling.LANCZOS)
    stream = io.BytesIO()
    opts = {'method': 6} if fmt == 'webp' else {'speed': 6}
    resized.save(stream, format=fmt.upper(), quality=quality, **opts)
    data = stream.getvalue(); digest = hashlib.sha256(data).hexdigest()[:10]
    dest = OUT / f'{stem}-{width}-{digest}.{fmt}'
    dest.write_bytes(data)
    return {'src': './assets/responsive/' + dest.name, 'width': width, 'height': resized.height, 'bytes': len(data)}
for file in sorted(ASSETS.glob('*.webp')):
    if file.stem.endswith('-small'): continue
    im = Image.open(file)
    item = {'original': './assets/' + file.name, 'originalBytes': file.stat().st_size, 'width': im.width, 'height': im.height}
    for fmt,widths in [('avif',[160,320,480,960]),('webp',[240,480,960])]:
        if file.stem == 'portrait': widths = [320,640,960,im.width]
        widths = sorted(set(min(w, im.width) for w in widths))
        q = (57 if fmt == 'avif' else 80) if file.stem == 'portrait' else (50 if fmt == 'avif' else 74)
        item[fmt] = [save_image(im,file.stem,w,fmt,q) for w in widths]
    manifest['images'][file.stem] = item
for file in sorted((ASSETS/'films').glob('*.webp')):
    im = Image.open(file)
    manifest['posters'][file.stem] = {'originalBytes':file.stat().st_size,'variants':[save_image(im,'film-'+file.stem,w,'webp',72) for w in [384,576]]}
for file in sorted(ASSETS.glob('*.ttf')):
    font=TTFont(file); options=subset.Options(); options.flavor='woff2'
    sub=subset.Subsetter(options=options)
    sub.populate(unicodes=list(range(0x0000,0x0250))+list(range(0x1e00,0x1f00))+list(range(0x2000,0x2070))+list(range(0x2190,0x2200))+[0x20ac])
    sub.subset(font); font.flavor='woff2'
    buffer=io.BytesIO();font.save(buffer);data=buffer.getvalue()
    dest=FONTS/(file.stem+'-'+hashlib.sha256(data).hexdigest()[:10]+'.woff2');dest.write_bytes(data)
    manifest['fonts'][file.stem]={'src':'./assets/fonts/'+dest.name,'bytes':len(data),'originalBytes':file.stat().st_size}
(ROOT/'docs/media-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'images':len(manifest['images']),'variants':len(list(OUT.iterdir())),'fontsBefore':sum(f['originalBytes'] for f in manifest['fonts'].values()),'fontsAfter':sum(f['bytes'] for f in manifest['fonts'].values())}))
