const randomSixDigit = () => {
  let result = "";
  let i = 0;
  while (i < 6) {
    let num = parseInt(String(Math.random() * 10));
    result += num;
    i++;
  }
  return result;
};

export default randomSixDigit;
