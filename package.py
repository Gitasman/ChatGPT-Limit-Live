"""Validate and package deterministic source/extension ZIPs without dependencies."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parent
extension = root / 'extension'
manifest = json.loads((extension / 'manifest.json').read_text())
package = json.loads((root / 'package.json').read_text())
assert manifest['manifest_version'] == 3
assert manifest['version'] == package['version']
assert manifest['permissions'] == ['storage', 'alarms']
refs = [manifest['action']['default_popup'], manifest['background']['service_worker'], 'core.js', 'ui.js', 'color-editor.js', 'popup.js', *manifest['icons'].values()]
for script in manifest['content_scripts']:
    assert script['matches'] == ['https://chatgpt.com/*']
    refs.extend(script.get('js', []))
for name in refs:
    assert (extension / name).is_file(), f'Missing {name}'
version = manifest['version']
destination = root / 'downloads'
destination.mkdir(exist_ok=True)
archive = destination / f'ChatGPT-Limit-Live-v{version}.zip'
prefix = f'ChatGPT-Limit-Live-v{version}'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as out:
    for path in sorted(root.rglob('*')):
        relative = path.relative_to(root)
        if not path.is_file() or any(part in {'downloads', 'node_modules', '__pycache__', '.git'} for part in relative.parts):
            continue
        if path.name == '.DS_Store' or path.name.startswith('.env') or path.suffix == '.pyc':
            continue
        info = zipfile.ZipInfo(f'{prefix}/{relative.as_posix()}', date_time=(1980, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        out.writestr(info, path.read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
with zipfile.ZipFile(archive) as out:
    assert out.testzip() is None
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    (destination / (archive.name + '.sha256')).write_text(f'{digest}  {archive.name}\n')
    print(f'Archive verified: {archive.name}; {len(out.namelist())} files; {archive.stat().st_size} bytes')
    print(f'SHA-256: {digest}')
