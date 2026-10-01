# AI Resume Analyzer — theme-aware print report

## Apply the update

1. Back up your current frontend files.
2. Replace `index.html`, `style.css` and `script.js` in the same frontend folder.
3. Keep your current `theme.js`. The included copy is identical to the previous version.
4. Leave `server.js` and all backend files unchanged.
5. Start your project normally and refresh the browser with Ctrl+F5.

These files are intended to run inside your existing project. The backend remains responsible for analysis; this is not a standalone analysis service.

## Print or save a report

1. Upload your resume and enter a target job description.
2. Complete the analysis.
3. Select light or dark mode on the website.
4. Click **Print / Save Report**.
5. In Chrome or Edge, select **Save as PDF**, **A4**, **Portrait**, and **100%** scale. Keep the default margins so the stylesheet's page margins can apply.
6. Under **More settings**, enable **Background graphics** and disable **Headers and footers** for a clean report.
7. Check the preview and save. To use another theme, cancel, switch the website theme and print again.

The print CSS uses the active website theme. Browser/user print settings take precedence over CSS, so background colours cannot be guaranteed when background printing is disabled. Physical printers may leave unprinted margins. The filename proposed by the browser may vary; the application supplies a report-specific document title as a hint.

## Changes by file

- `index.html`: adds a print-only report heading, analyzed resume filename, analysis timestamp, endnote and on-screen print-setting guidance. All original IDs and form fields remain intact.
- `style.css`: replaces the forced-light print rules with theme-aware A4 report styling. Uses one reading column, readable print text sizes, clear headings, page margins, wrapping for long content and page-break rules. Long sections may flow across pages instead of being constrained to a fixed height.
- `script.js`: retains the existing upload, sample job description, analysis and rendering flows. Adds report metadata, finishes the score animation before printing, guards against printing an unavailable report and restores the tab title after print/cancel. Score verdicts and empty-state text now use theme variables so they remain readable in dark mode. Markdown escaping from the supplied pasted source has been removed to produce executable JavaScript.
- `theme.js`: unchanged.

## Backend contract

The request remains `POST /api/analyze`, with FormData fields `resume` and `jobDescription`. The expected response remains `{ success: true, data: ... }`, with the same analysis fields. Printing calls `window.print()` and does not make an API request, re-analyze the resume or send anything to a PDF service. No new dependencies are required.

The report filename and timestamp are captured when the analysis succeeds. Changing the upload field afterwards does not relabel the existing report. Printing immediately after analysis uses the final score, even if the on-screen number animation had not finished.

## Checks performed

- JavaScript syntax checks for both scripts.
- All original element IDs, form field names, HTML nesting and SVG references.
- Controller tests with simulated DOM and API responses: unchanged request contract; light/dark theme retention; score ranges; correct filename; print during animation; no API calls on print; tab title restoration; reset and error guards.
- Verified `theme.js` is unchanged.

Actual PDF pagination, browser print-dialogue appearance and live backend operation were not verified. Browser-based visual testing was attempted, but the browser download failed in the execution environment. Please inspect one light and one dark print preview after installation, including a long report.

## References

- MDN: Printing — https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Printing
- MDN: print-color-adjust — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/print-color-adjust
