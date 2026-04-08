module.exports = function generateCode(kabupaten){

 const prefix = kabupaten.substring(0,3).toUpperCase()

 const date = new Date()

 const ym =
  date.getFullYear().toString().slice(2) +
  (date.getMonth()+1).toString().padStart(2,'0')

 const rand = Math.floor(1000+Math.random()*9000)

 return `NU-${prefix}-${ym}${rand}`

}