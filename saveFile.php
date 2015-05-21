<?php

if (isset($_POST['data'])) {
  $data = $_POST['data'];

  $savePath = "output/";
  $fname = "";
  if ( isset($_POST['fname']) and !file_exists($savePath . $_POST['fname']) )
    $fname = $savePath . $_POST['fname'];
  else
    $fname = $savePath . mktime() . ".json";  //random name


  $file = fopen($fname, 'w');
  fwrite($file, $data);
  fclose($file);
}

?>
