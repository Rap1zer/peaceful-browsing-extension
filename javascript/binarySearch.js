function binarySearch(array, item) {
  let min = 0;
  let max = array.length - 1;
  while (min <= max) {
    // Calculate the middle index of the array
    let midIndex = Math.floor((max + min) / 2);
    //console.log(max + " + " + min);
    // Check if the middle value of the array is smaller or bigger than the desired item
    let result = item.localeCompare(array[midIndex]);
    //console.log("result: " + array[midIndex] + " item: " + item);

    // The result equals the item being searched for
    if (result === 0) {
      return midIndex;
    } else if (result > 0) {
      // The item comes after the result, ignore smaller half
      min = midIndex + 1;
    } else if (result < 0) {
      // The item comes before the result, ignore bigger half
      max = midIndex - 1;
    }
  }

  // Item does not exist
  return -1;
}
