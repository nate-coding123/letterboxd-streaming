const axios = require("axios");
const cheerio = require("cheerio");


async function getWatchlist(username){

let films=[];
let page=1;
let hasMore=true;

while(hasMore){

const url=
`https://letterboxd.com/${username}/watchlist/page/${page}/`;

try{

const response=
await axios.get(url);

const $=
cheerio.load(response.data);


$(".poster-container").each((i,el)=>{

const title=
$(el).find("img").attr("alt");

if(title)
films.push(title);

});

if($(".next").length===0)
hasMore=false;

page++;

}catch{

hasMore=false;

}

}

return films;

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


const services=
offers.map(o=>o.package_short_name);

return [...new Set(services)];

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

res.status(400).json({
error:"Missing username"
});

return;
}


const films=
await getWatchlist(username);


let results={};


for(let film of films){

const services=
await getStreaming(film,country);


if(!services.length){

if(!results["Not Streaming"])
results["Not Streaming"]=[];

results["Not Streaming"].push(film);

}
else{

services.forEach(service=>{

if(!results[service])
results[service]=[];

results[service].push(film);

});

}

}


res.json(results);

};
