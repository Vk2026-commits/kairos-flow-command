<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Image-backed maps use the original 1358 × 843 annotation canvas, fitted uniformly inside the viewport; keep imagery, paths, playback, and HTML pins in that same wrapper so saved plans do not drift when viewers resize or zoom.
- Derive full consulting permissions for client admins only after resolving their authorized organization; never store global admin for a client-only login, because it bypasses site isolation.
- Fullscreen presentation belongs to the map element, with viewport fallback and dashboard-panel hiding; preserve the mounted map so playback and saved overlay state survive entry and exit.
