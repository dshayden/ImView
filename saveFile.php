<?php

echo "before if\n"; 
print("not empty");

if (isset($_POST['data'])) {
  print("not empty");

  $data = $_POST['data'];
  $fname = mktime() . ".txt";//generates random name

  $file = fopen("output/" .$fname, 'w');//creates new file
  fwrite($file, $data);
  fclose($file);
}

?>
