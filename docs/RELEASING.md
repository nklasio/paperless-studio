# Releasing

Container releases are driven by Git tags. A tag named `vX.Y.Z` publishes a
multi-architecture image to GitHub Container Registry.

## Create a release

1. Make sure `main` is up to date and the CI workflow passes.
2. Choose a semantic version.
3. Create and push an annotated tag:

   ```bash
   git switch main
   git pull --ff-only
   git tag -a v0.1.0 -m "Paperless Studio v0.1.0"
   git push origin v0.1.0
   ```

4. Follow the `Release container` workflow in GitHub Actions.
5. Confirm the package is public after its first publication.

For a stable `v1.2.3` release, the workflow publishes:

- `ghcr.io/nklasio/paperless-studio:1.2.3`
- `ghcr.io/nklasio/paperless-studio:1.2`
- `ghcr.io/nklasio/paperless-studio:1`
- `ghcr.io/nklasio/paperless-studio:latest`

Pre-release versions such as `v1.2.3-rc.1` receive version tags but do not
replace `latest`.

Images are built for `linux/amd64` and `linux/arm64` and include SBOM and
provenance attestations.
