<?php
header('Content-Type: application/json');
if (isset($_POST['fname'])) {
  $fname = '';
  if ( strcmp($_POST['fname'], "latest") == 0 ) {
    $files = scandir('output/', SCANDIR_SORT_DESCENDING);
    $fname = 'output/' . $files[0];
  } else {
    $fname = 'output/' . $_POST['fname'];
  }

  $data = file_get_contents($fname);
  echo $data;
}
?>
