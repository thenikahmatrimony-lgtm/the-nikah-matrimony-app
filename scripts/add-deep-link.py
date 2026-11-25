from pathlib import Path
import re

manifest = Path("android/app/src/main/AndroidManifest.xml")
source = manifest.read_text()
if 'android:host="auth"' in source:
    print("TNM password recovery deep link already configured")
else:
    pattern = r'(<activity\\b[^>]*android:name="[^"]*MainActivity"[^>]*>)([\\s\\S]*?)(</activity>)'
    match = re.search(pattern, source)
    if not match:
        raise SystemExit("MainActivity not found in AndroidManifest.xml")
    intent = """
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="com.thenikahmatrimony.app" android:host="auth" android:pathPrefix="/reset" />
            </intent-filter>
"""
    source = source[:match.end(2)] + intent + source[match.end(2):]
    manifest.write_text(source)
    print("TNM password recovery deep link configured")
