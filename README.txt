GyroLux Layout Optimizer v8
README

1. What this app does
GyroLux Layout Optimizer v8 is a browser-based facility layout tool for painting departments onto a grid, locking finished areas, testing layout-generation algorithms, and scoring the result using flow-based and adjacency-based measures.

The app is designed to help with facility layout and material handling problems where you want to:
- define departments with required area
- place or paint departments on a grid
- lock some departments in place
- control whether departments can grow or shrink
- import workbook data
- run layout algorithms
- compare D-Score and A-Score results
- export the final layout and results

2. How to open the app
Local use:
- Keep the latest HTML file on your computer.
- Double-click it to open it in a browser, or right-click and open with Chrome/Edge.
- No server is required for normal use.

GitHub Pages use:
- Rename the final HTML file to index.html
- Put it in the publishing location for the repo
- Publish with GitHub Pages

3. Main screen layout
The interface has three sections:

Left panel:
- department list
- active department selection
- paint tools
- quick controls for each department

Center panel:
- layout grid
- painted layout view
- adjacency status chips below the grid

Right panel:
- algorithm controls
- score summaries
- workbook tools
- configuration tools
- add, edit, and remove department tools

4. Core concepts
Department:
A facility area such as Receiving, Machining, Testing, Shipping, and so on.

Grid:
The layout canvas divided into cells. Each cell represents an area based on the feet-per-cell setting.

D-Score:
A flow-distance score. Lower is better.
It is based on how much movement occurs between departments and how far apart those departments are.

A-Score:
An adjacency score. Higher is better.
It rewards preferred adjacency relationships and penalizes undesirable ones.

Locked department:
A department whose current painted position is frozen during algorithm runs.

MAX or capped department:
A department marked with a target cap. When Upper Bound is ON, the department cannot exceed its target area.

Grow:
The department is allowed to absorb extra free space if available.

Shrink:
The department is allowed to be reduced first if the grid is tight on space.

Upper Bound:
When ON, capped departments cannot exceed their target area.
When OFF, capped departments may exceed the target area.

5. Top bar
The top bar shows:
- project title
- current facility size
- current D-Score
- current A-Score
- E relationship satisfaction
- X violations
- target area versus total capacity
- whether data is from defaults or workbook
- whether Upper Bound is ON or OFF

It also includes:
- compact grid size controls
- Apply button for grid size
- Grid on or off toggle
- Upper Bound on or off toggle
- Export XLSX button

6. Left panel usage
Paint tools:
- Paint: place the active department one cell at a time
- Rect: paint a rectangular block
- Erase: remove painted cells

Department cards:
Each department card shows:
- color
- name
- abbreviation
- target area
- painted area progress
- painted cells versus target cells
- grow and shrink state
- cap state
- lock state

Buttons on each department:
- Lock: lock or unlock the department
- MAX: toggle cap marker
- Edit: open department editing on the right panel
- Remove: delete the department
- plus Grow: allow expansion into extra free space
- minus Shrink: allow early reduction if space is tight

Clear All:
Clears all unlocked painted areas.

7. Painting on the grid
To paint:
- select a department in the left panel
- choose Paint or Rect
- click or drag on the center grid

To erase:
- choose Erase
- click or drag over cells

Important behavior:
- locked cells cannot be painted over
- capped departments obey target limit when Upper Bound is ON
- if a capped department reaches its limit, the app refuses extra placement

8. Right panel tabs
A. Algo tab
Use this tab to run algorithms.

Available algorithms:
- CRAFT
- Random Multi-Start plus CRAFT
- CORELAP
- ALDEP
- BLOCPLAN
- Hybrid REL plus D-Score

What each needs:
- flow-based algorithms need flow or D-score data
- adjacency-based algorithms need REL or adjacency data
- hybrid needs both

Typical controls:
- columns
- max iterations
- trials
- CRAFT iterations per trial

Run:
- click Run Algorithm to generate or improve a layout

B. Scores tab
Shows:
- D-Score
- A-Score
- E satisfied count
- X violations
- painted versus target bars
- D-score breakdown
- recent activity log

Use this tab after generating a layout to understand how good the result is.

C. Data tab
Use this tab for workbook handling.

Supported workbook content:
- Departments sheet
- FlowPairs or FlowMatrix sheet
- RewardPairs or RewardMatrix sheet
- optional Layout sheet
- optional Meta sheet

What import does:
- reads workbook locally in the browser
- updates departments
- updates flow pairs
- updates adjacency pairs
- optionally restores a layout
- optionally restores grid size and Upper Bound setting

Template export:
- exports a starter workbook template

D. Config tab
Use this tab to:
- change grid width
- change grid height
- change feet per cell
- apply new layout size
- see capacity check summary

Behavior:
- resizing preserves the overlapping top-left part of the existing layout

E. Add Dept tab
Use this tab to:
- add new departments
- edit existing departments
- remove departments

Editable department properties:
- name
- abbreviation
- target area
- color
- capped
- grow
- shrink

9. Algorithms summary
CRAFT:
- pairwise exchange improvement
- flow based
- good for improving an existing ordering

Random Multi-Start plus CRAFT:
- tries multiple random starts
- improves each with CRAFT
- keeps the best result

CORELAP:
- adjacency-driven placement
- works from REL data
- good when closeness ratings matter

ALDEP:
- adjacency-driven alternative layouts
- runs several tries and keeps the best one

BLOCPLAN:
- block-style adjacency ordering plus refinement

Hybrid:
- combines flow and adjacency effects

10. Import and export
A. Workbook import
From the Data tab:
- choose an Excel workbook
- the app parses it locally
- the workbook is not uploaded by the page itself

Accepted sheet examples:
- Departments
- FlowPairs
- RewardPairs
- FlowMatrix
- RewardMatrix
- Layout
- Meta

B. Workbook export
The Export XLSX button creates an analysis workbook with:
- layout grid
- department list
- flow pairs
- reward pairs
- distance details
- score summary

C. JSON snapshot export and import
If your v8 file includes browser snapshot tools:
- export JSON to save the app state
- import JSON to restore the app state later

This is useful for quick backups and versioning of layouts.

D. Browser save and load
If your v8 file includes browser save and load:
- Save stores the current state in the browser
- Load restores the stored state from the browser

Note:
- browser save is tied to that browser and device
- it is not cloud storage

11. Suggested workflow
Recommended workflow:
1. Open the app
2. Check grid size and feet-per-cell
3. Import workbook if you have one
4. Review departments on the left
5. Paint or lock departments that must stay fixed
6. Mark capped departments with MAX if needed
7. Turn Upper Bound ON if you want strict cap enforcement
8. Set grow and shrink flags where appropriate
9. Run an algorithm from the Algo tab
10. Review metrics in the Scores tab
11. Export XLSX or save a JSON or browser snapshot

12. Practical interpretation tips
For D-Score:
- lower is better
- big contributors usually indicate departments with heavy flow placed too far apart

For A-Score:
- higher is better
- especially important pairs should ideally be adjacent
- X pairs should not be adjacent

For target versus painted:
- large overfill means the department got more area than planned
- large underfill means it has not reached target area

For locks:
- use locks only for departments that truly must stay fixed
- too many locks reduce algorithm flexibility

13. GitHub Pages publishing
To publish on GitHub Pages:
1. Rename the final HTML file to index.html
2. Create a GitHub repository
3. Upload index.html and any related files
4. Go to Settings, then Pages
5. Under Build and deployment, choose Deploy from a branch
6. Select the branch and folder:
   - root if index.html is in the branch root
   - docs if index.html is inside a docs folder
7. Save and wait for deployment

Common URL pattern:
https://yourusername.github.io/repository-name/

If using another branch:
- the site URL usually stays tied to the repository name
- only the publishing source changes

14. Troubleshooting
Problem: layout looks wrong after editing files on GitHub Pages
Possible fix:
- do a hard refresh in the browser
- make sure the latest file was uploaded correctly

Problem: algorithm refuses to run
Possible fix:
- check whether the selected algorithm has the required workbook data
- flow-based methods need flow data
- adjacency-based methods need REL or adjacency data

Problem: department will not paint more cells
Possible fix:
- it may be locked
- it may be capped and Upper Bound is ON
- it may already have reached its target area

Problem: imported workbook does not load properly
Possible fix:
- verify sheet names
- verify column names
- make sure departments referenced in pairs exist in the Departments sheet

Problem: score seems odd
Possible fix:
- check flow pairs
- check REL pairs
- check locks
- check whether grid size is too small
- inspect the biggest D-score contributors in the Scores tab

15. Best practices
- keep a clean workbook template
- lock only truly fixed departments
- use MAX only where hard target caps matter
- use grow and shrink intentionally
- compare more than one algorithm
- export results after major milestones
- save JSON or browser snapshots before big changes

16. File naming suggestion
For local versioning, use names like:
- GyroLux_v8_working.html
- GyroLux_v8_caseA.html
- GyroLux_v8_caseB.html

For GitHub Pages:
- rename the deployed file to index.html

End of README
