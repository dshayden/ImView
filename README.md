ImView
=======
Rapid, web-based video annotation tool.

Setup (Assuming Ubuntu or Similar)
=======
1. Ensure php5+ is installed on the system.
2. Copy the entire directory to a web-hostable folder.
3. Copy all images you intend to be shown in the inferface to the images/
   subdirectory. Note: there are security issues with linking files horizontal to
   or above the website's root directory; browsers will probably not let it happen.
4. Replace data/imgs.json with a JSON file with the following format:
     { "frames": ["images/...", "images/...", ...] }
   Note: be very careful about format, an extraneous comma at the end of the
   list will cause the whole thing to fail; seems the JSON reading is fragile.
5. If not running as a service, type ./run.sh adjusting the port number in the
   script as desired; else, let Apache, Nginx, etc. serve it from the
   appropriate directory.

Notes
=======
* The website has been observed to smoothly stream ~1024 x 768 images within the
  local network; it may manage better than that, but hasn't been tested. In any
  case, it handles arbitrary image sizes, though going too large or too small
  may require some minor tweaking of the CSS for aesthetics.
* The website most notably uses:
  * JQuery: https://jquery.com/ : for sane Javascript coding.
  * JQuery-UI: https://jqueryui.com/ : for UI stuff.
  * DataTables: https://datatables.net/ : for structured annotation storage.
  * Lazy-JS: http://danieltao.com/lazy.js/ : for minor convenience.
  * Fabric-JS: http://fabricjs.com/ : for HTML5 Canvas operations (if used,
                                      can't remember?)

* User code is primarily contained in 
  * ./index.html: website entry point
  * src/script.js: Meat of the web scripting, with entry point at init()
  * src/annotations.js: annotation types, see their methods for the interface
                        one must define if new annotation types are desired.
  * src/

* Website Use
  * This webapp is currently designed to expedite single-user, single-view
    image-set annotation with various primitives (rectangles, points, lines),
    and experimentally supports hiearchical annotations (i.e. annotations of
    annotations, e.g. the Group annotation, which is placed atop two existing
    annotations). 
  * Annotation is expedited relative to existing approaches largely via a
    hotkey-driven interface that most notably uses:
    * F: Commit Active Annotation
    * G: Play / Pause Video
    * R: Reverse / Re-Reverse Video
    * T: Advance playSkip # of frames, where playSkip is the integer value in
         the playSkip field (normally 1, but could be any positive or negative
         integer).
    * A,D,W,S,L,J,K,I: movement and resize hotkeys, though seem to have stopped
      working with a recent version of Chrome; non-essential but worth fixing at
      some point. See script.js : function processKeys(evt) for details.
  * Annotations are collectively organized as Annotation Groups, Annotation
    Ranges, and Annotation Instances.
      * Annotation Instances have an Annotation Type (e.g. rect) and are tied to
        a unique Annotation Range and also to an image frame.
      * Annotation Ranges contain 0 or more Annotation Instances, and are tied
        to a unique Annotation Group. Annotation Ranges assume that some form of
        interpolation is valid between Annotation Instances, though the specific
        form of interpolation this takes is user-definable for new annotation
        types (see the function getData(frame) of the various *Range objects in
        src/Annotations.js), e.g. RectangleRange.GetFrame(frame). An example is
        that a rectangle's size and position are linearly interpolated within an
        Annotation Range, which is valid while the target is visible /
        non-obstructed. There would be multiple Annotation Ranges with the Rect
        Annotation Type for a specific Annotation Group if a particular object
        came in and out of visibility multiple times throughout a video.
      * Annotation Groups uniquely contain 0 or more Annotation Ranges. They are
        what one might typically associate with image/video entities, e.g. a
        single, specific car. They might also correspond to more abstract
        entities such as Group010, the 10th "group," which would presumably
        contain an AnnotationRange of the Group Annotation Type and reference
        other Annotations.
  * Annotations are saved/loaded via the server-side scripts saveFile.php and
    loadFile.php. By default, the most recently-saved annotations are loaded on
    for a new connection. Note that all annotation and data storage is in the
    browser, and is only sent to/from the server via these sparse save/load
    calls. Users should click Options -> Save when done to ensure annotations
    are saved. There is currently no robustness to handle downed servers, etc.
    so the potential for losing large amounts of work does exist, but is
    mitigated by the fact that progress can be saved and is auto-saved.

Future Work
=======
* UI: Fix/improve hotkey use, allow user-loading of different save states.
* Code: Clean up, comment, write unit tests
* Session Handling (for multiple users), authentication (for specific users).
* Support for multiple backends (SQL, server-side calls beyond save)
