import base64, io, os
from PIL import Image
from pathlib import Path
root=Path(__file__).resolve().parents[1]
encoded=(root/'www/assets/tnm-logo.jpg.b64').read_text().strip()
raw=base64.b64decode(encoded)
img=Image.open(io.BytesIO(raw)).convert('RGB')
assets=root/'www/assets'
assets.mkdir(parents=True,exist_ok=True)
img.save(assets/'tnm-logo.jpg',quality=90,optimize=True)
res=root/'android/app/src/main/res'
sizes={'mipmap-mdpi':48,'mipmap-hdpi':72,'mipmap-xhdpi':96,'mipmap-xxhdpi':144,'mipmap-xxxhdpi':192}
for folder,size in sizes.items():
    target=res/folder
    target.mkdir(parents=True,exist_ok=True)
    icon=img.resize((size,size),Image.Resampling.LANCZOS)
    icon.save(target/'ic_launcher.png',format='PNG',optimize=True)
    icon.save(target/'ic_launcher_round.png',format='PNG',optimize=True)
# Remove adaptive icon XMLs so Android uses the supplied branded PNG launcher icons.
for folder in [res/'mipmap-anydpi-v26']:
    if folder.exists():
        for name in ['ic_launcher.xml','ic_launcher_round.xml']:
            f=folder/name
            if f.exists(): f.unlink()
print('Generated The Nikah Matrimony branded launcher icons.')
