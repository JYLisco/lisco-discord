export const mergeArray = (array: Array<String>):Array<String>  => {
    let mergedResult = [array[0]];
    let currentLength = array[0].length;
    for (let i = 1; i < array.length; i++) {
      const line = array[i];
  
      if (currentLength + line.length + 1 > 2000) {
        mergedResult.push(line);
        currentLength = line.length;
      } else {
        mergedResult[mergedResult.length - 1] += "\n" + line;
        currentLength += line.length + 1;
      }
    }
  
    return mergedResult.filter((str) => str.trim() !== "");
  };