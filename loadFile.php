<?php
header('Content-Type: application/json');
if (isset($_POST['fname'])) {
  $fname = 'output/' . $_POST['fname'];
  $data = file_get_contents($fname);
  echo $data;
}
?>
