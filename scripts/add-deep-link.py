from pathlib import Path
import xml.etree.ElementTree as ET

manifest = Path("android/app/src/main/AndroidManifest.xml")
tree = ET.parse(manifest)
root = tree.getroot()
android = "{http://schemas.android.com/apk/res/android}"
found = False
for activity in root.iter("activity"):
    if activity.get(android + "name", "").endswith("MainActivity"):
        intent = ET.SubElement(activity, "intent-filter")
        ET.SubElement(intent, "action", {android + "name": "android.intent.action.VIEW"})
        ET.SubElement(intent, "category", {android + "name": "android.intent.category.DEFAULT"})
        ET.SubElement(intent, "category", {android + "name": "android.intent.category.BROWSABLE"})
        ET.SubElement(intent, "data", {
            android + "scheme": "com.thenikahmatrimony.app",
            android + "host": "auth",
            android + "pathPrefix": "/reset"
        })
        found = True
        break
if not found:
    raise SystemExit("MainActivity not found in AndroidManifest.xml")
tree.write(manifest, encoding="utf-8", xml_declaration=True)
print("TNM password recovery deep link configured")
