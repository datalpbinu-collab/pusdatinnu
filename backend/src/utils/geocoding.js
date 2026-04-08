const axios = require('axios')

exports.reverseGeocode = async (lat,lng)=>{

 try{

  const res = await axios.get(
   `https://nominatim.openstreetmap.org/reverse`,
   {
    params:{
     format:'jsonv2',
     lat,
     lon:lng
    },
    headers:{
     'User-Agent':'NUPeduliApp'
    }
   }
  )

  return res.data

 }catch(e){

  return null

 }

}