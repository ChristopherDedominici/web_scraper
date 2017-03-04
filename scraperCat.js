var request = require("request");
cheerio = require("cheerio");
var xlsx = require('xlsx-writestream');

url = "website URL";
var done=false;
var totConf=0;
var allPersons=[];

//prima pagina seleziona gli stati  
request(url, function (error, response, body) {
  
	console.log('statusCode:', response && response.statusCode); 


  	if (!error) {
    	    	
    	var $ = cheerio.load(body);
      	var statesURL=[];

      	$('#block-views-NUM34-935e16b28ce1746e40 .views-summary').find('li a').each(function(i, elem) {
  				statesURL[i] = url + $(this).attr('href');
		});
		
		var i;
		
		console.log("tot states are :" + statesURL.length);
		//___________________________________________
		//____________________________________________
		
		for(i=0; i<statesURL.length; i++){
			
			openPerson(statesURL[i]);
			
			//console.log(statesURL[i]);

			require('deasync').loopWhile(function(){return !done;});
			done=false;

			console.log("-------");
		}

		console.log(allPersons.length);


		xlsx.write('mySpreadsheet.xlsx', allPersons, function (err) {
    	// Error handling here
		});






		//else del primo request a sito
  	} else {
    		console.log("We’ve encountered an error: " + error);
  	}

});



function openPerson(statesURL) {
    		
			var $;
    		var personAddresses=[];
    		var doneCollect=false;	

    		//second page 
			request(statesURL, function (error, response, body) {
					
					if(response.statusCode!==404){ //la pagina esiste
						$ = cheerio.load(body);

						var tot=$('.views-T-table .views-f-title').find('a').length;
						
						totConf=0;	

						$('.views-T-table .views-f-title').find('a').each(function(j, elem) {
  							
  							personAddresses[j] = url + $(this).attr('href');
  							console.log(j + " " + personAddresses[j]);


  							collectInfo(personAddresses[j]);
  						});

						require('deasync').loopWhile(function(){return tot!==totConf;});

						//console.log("done");
						
						//controlla se la pagina sta continuando dopo
						var nextIsPresent=$('.item-list .clearfix .pager-next').find('a').attr('href');

						if(nextIsPresent!==undefined){
						
							nextIsPresent=url + nextIsPresent;	
							console.log(nextIsPresent);
							openPerson(nextIsPresent);
							require('deasync').loopWhile(function(){return !done;});
						}
							
							
					}

					done=true;
			});
	require('deasync').loopWhile(function(){return !done;});	
	return 1;
}




function collectInfo(personURL){

	var personInfo;
    var $;

    var fName, primPhone, secPhone, add, web, own, em;
    var emailLink;
    /*
		Person Name
		Owner
		Primary Phone:
		Secondary Phone:
		Address
		Website
		Email
    */

    //3 page
	request(personURL, function (error, response, body) {
					
		if(response.statusCode!==404){ //la pagina esiste
			
			$ = cheerio.load(body);

			
			var td1;

			//----------------------------------------
			fName=$('#page-title').text();

			//-----------------------------------------
			td1=$('.node-b-paid .f-name-top-display-logo').find('td');

			var str=td1.text();
			
			var n = str.search("http");
			if(n===-1){
				n = str.search("www");
			}
			str=str.substr(0,n);
			own=str.substr(9,str.length);
			
			//-----------------------------------------
			
			var temp=[];
			$('.node-b-paid .f-name-top-display-logo').find('a').each(function(k, elem) {
  					temp[k]=$(this).attr('href');
			});
			web=temp[0];
			emailLink=url + temp[1];
			//console.log(web);
			//console.log(emailLink);

			//-------------------------------------------------

			str=td1.text();
			
			n = str.search("Phone");
			str=str.substr(n+7,str.length);
			//console.log(str);
			primPhone=str;
			primPhone=primPhone.substr(0,12);
			secPhone=str.substr(str.length-14, str.length);
			//console.log(primPhone);
			//console.log(secPhone);

			//-----------------------------------------------------

			
			var street=$('.street-address').find('span').text();

			var postalCode=$('.postal-code').text().replace(/\s/g,'');
			
			var locality=$('.locality').text().replace(/\s/g,'');
			
			var region=$('.adr .region').text().replace(/\s/g,'');
			
			var countryN=$('.country-name').text().replace(/\s/g,'');
			
	

			personInfo={
							fName: fName,
							owner: own,
							Phone_1: primPhone,
							Phone_2: secPhone,
							Street: street,
							Postal_Code: postalCode,
							Locality: locality,
							Region: region,
							Country_Name: countryN,
							website: web,
							email: null,
			};



			var doneEmail=false;
			//GET EMAIL ON OTHER PAGE
			request(emailLink, function (error, response, body) {
					
				if(response.statusCode!==404){ //la pagina esiste
			
					$ = cheerio.load(body);
					em=$('#page-title').text();
					em=em.substr(8,em.length);
					//console.log(em);

					personInfo.email=em;
					
				}	
				allPersons.push(personInfo);
				doneEmail=true;
			});

			require('deasync').loopWhile(function(){return !doneEmail;});

		}	

		totConf++;
	});
}