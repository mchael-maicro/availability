AVAILABILITY MAP - README (Updated for Excel/OneDrive support)

Files included:
- index.html
- floorplan.svg
- script.js
- 0_done.pdf (original PDF)

How it works now:
- The page can read statuses from a published Google Sheet CSV (SHEET_CSV_URL) OR read an Excel file (.xlsx) directly from a public link (EXCEL_URL).
- For Excel/OneDrive: the script reads column C rows 3..44 (C3..C44) and places the values next to Shop-1 .. Shop-42 respectively.
  * Row 3 -> Shop-1
  * Row 4 -> Shop-2
  * ...
  * Row 44 -> Shop-42

If your Excel is a OneDrive share link, ensure the file is publicly accessible. The provided EXCEL_URL was inserted into script.js automatically. If it doesn't load due to OneDrive redirect protections, you can instead:
1) Download the file and re-upload to a public hosting, or
2) Export CSV from Excel Online (Share -> Get a link -> Export as .csv) and use SHEET_CSV_URL in script.js.

Edit script.js to change SHEET_CSV_URL or EXCEL_URL as needed.

Notes:
- Status coloring from Google Sheet CSV works as before (expects columns 'unitId' and 'status').
- Area values (from Excel column C) will be displayed as text inside the SVG near each shop.
- If something doesn't load, open browser console (F12) to see errors; common issues are CORS or private file links.
