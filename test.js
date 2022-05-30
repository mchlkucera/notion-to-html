const url = "https://www.youtube.com/watch?v=K8bhKeV4nrQ&blablabla";
const end = url.lastIndexOf("&");
const x = url.substring(url.indexOf("v=") + 2, end > 0 ? end : url.length);
console.log(x);
