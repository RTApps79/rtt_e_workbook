SIMULATED RADIATION CENTER — extensible build
=============================================

RUN (recommended):  python -m http.server 8000   then open  http://localhost:8000/

FILES
  index.html / app.js .............. the Center
  simulated_radiation_center.html .. single-file build
  ADDING_COMPONENTS.md ............. how to fold in new files (READ THIS)
  *_activity.html / *_lab.html / mitosis_microscopev2.html ... embedded activities
  Treatment_Planning/ .............. drop your repo's planning files here

ADD A NEW FILE IN ~1 LINE
  1. Put the file in this folder (or Treatment_Planning/).
  2. In app.js -> COMPONENT REGISTRY, add one entry under the room id, e.g.:
       { name:'DVH Explorer', sub:'DVH practice', icon:'📈',
         group:'Treatment Planning', kind:'activity',
         src:'Treatment_Planning/dvh_explorer.html' }
  Done. It appears as a Learning Station with an "Open in new tab" button.

STATION KINDS
  activity = embed an HTML file (iframe + open-in-tab)
  native   = a module built into the app (e.g. Vital Signs Trainer)
  link     = open a URL/file in a new tab
