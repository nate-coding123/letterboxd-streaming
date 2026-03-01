const axios = require("axios");
const cheerio = require("cheerio");


// GET WATCHLIST
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

const poster=
$(el).find("img").attr("src");

if(title){

films.push({
title,
poster
});

}

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



// JUSTWATCH SEARCH
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
return null;


const item=
res.data.items[0];

const offers=
item.offers||[];

const services=
offers.map(o=>o.package_short_name);

return{

services:[...new Set(services)],
poster:item.poster
};

}catch{

return null;

}

}



// MAIN API
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



const results={};



await Promise.all(

films.map(async film=>{

const data=
await getStreaming(
film.title,
country
);


if(!data){

if(!results["Not Streaming"])
results["Not Streaming"]=[];

results["Not Streaming"].push(film);

return;

}


if(!data.services.length){

if(!results["Not Streaming"])
results["Not Streaming"]=[];

results["Not Streaming"].push(film);

return;

}


data.services.forEach(service=>{

if(!results[service])
results[service]=[];

results[service].push({

title:film.title,
poster:
film.poster ||
`https://images.justwatch.com${data.poster}`

});

});

})

);


res.json(results);

};
