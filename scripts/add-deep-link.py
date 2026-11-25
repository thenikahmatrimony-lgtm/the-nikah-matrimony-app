from pathlib import Path
import xml.etree.ElementTree as ET

manifest = Path("android/app/src/main/AndroidManifest.xml")
android_uri = "http://schemas.android.com/apk/res/android"
ET.register_namespace("android", android_uri)
tree = ET.parse(manifest)
root = tree.getroot()
android = "{" + android_uri + "}"
application = root.find("application")
if application is None:
    raise SystemExit("Android application element not found")
activities = application.findall("activity")
target = next((a for a in activities if a.get(android + "name", "").endswith("MainActivity")), None)
if target is None and activities:
    target = activities[0]
if target is None:
    raise SystemExit("No Android activity found in manifest")
for intent in target.findall("intent-filter"):
    data = intent.find("data")
    if data is not None and data.get(android + "host") == "auth":
        print("TNM password recovery deep link already configured")
        break
else:
    intent = ET.SubElement(target, "intent-filter")
    ET.SubElement(intent, "action", {android + "name": "android.intent.action.VIEW"})
    ET.SubElement(intent, "category", {android + "name": "android.intent.category.DEFAULT"})
    ET.SubElement(intent, "category", {android + "name": "android.intent.category.BROWSABLE"})
    ET.SubElement(intent, "data", {
        android + "scheme": "com.thenikahmatrimony.app",
        android + "host": "auth",
        android + "pathPrefix": "/reset"
    })
    tree.write(manifest, encoding="utf-8", xml_declaration=True)
    print("TNM password recovery deep link configured")
