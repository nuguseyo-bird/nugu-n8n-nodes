# Changelog

## 0.1.2

- Fixed n8n community node loader class resolution by aligning the exported `NuguTextUtility` class with the compiled node filename.

## 0.1.1

- Fixed community package installation in n8n by avoiding npm auto-install of the `n8n-workflow` peer dependency.
- Removed runtime imports from `n8n-workflow` so the node can load in n8n community package directories.

## 0.1.0

- Initial release.
- Added `Nugu Text Utility` node with:
  - `Clean Text` operation.
  - `Extract JSON` operation.
