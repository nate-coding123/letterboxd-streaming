const axios = require("axios");
const cheerio = require("cheerio");


async function getWatchlist(username){

let films=[];

try{

const url=
`https://letterboxd.com/${username}/watchlist/`;

const response=
await axios.get(url,{
headers:{
"User-Agent":
"Mozilla/5.0"
}
});

const $=
cheerio.load(response.data);


$(".poster-container").each((i,el)=>{

const title=
$(el).find("img").attr("alt");

const poster=
$(el).find("img").attr("src");

if(title){

films.push({
title,
poster
});

}

});


}catch(e){

return [];

}


return films.slice(0,40);

}



async function getStreaming(title,country){

try{

const res=
await axios.post(
`https://apis.justwatch.com/content/titles/${country}/popular`,
{
query:title,
page_size:1
}
);

if(!res.data.items.length)
return [];


const offers=
res.data.items[0].offers||[];

return[
...new Set(
offers.map(o=>o.package_short_name)
)

];

}catch{

return [];

}

}



module.exports=async(req,res)=>{

const username=
req.query.username;

const country=
req.query.country||"US";


if(!username){

res.json({
error:"Missing username"
});

return;

}


const films=
await getWatchlist(username);


if(!films.length){

res.json({
error:
"Username not found or watchlist empty"
});

return;

}


const results={};



await Promise.all(

films.map(async film=>{

const services=
await getStreaming(
film.title,
country
);


const service=
services[0]||"Not Streaming";


if(!results[service])
results[service]=[];


results[service].push(film);

})

);


res.json(results);

};
