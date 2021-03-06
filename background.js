//handling url pull from each active chrome tab
chrome.tabs.onUpdated.addListener(function(id,activeInfo,tab)
{
  var tablink = tab.url;

  if (tablink.substring(0,15) == 'https://psalabs')
  {
    var tablink_new = tablink.slice(29, 1110);
    var request1 = new XMLHttpRequest(); 
    request1.open('POST', 'https://xu7y0i4je8.execute-api.us-east-2.amazonaws.com/test/tokenPython', true);
    var temp1 = '{"token": "'+tablink_new+'"}' //append url in a new variable for expected format
    var payload1 = JSON.parse(temp1)
    var output1 = request1.send(temp1);
    request1.onreadystatechange = function()
    {
      chrome.storage.local.set({userId: JSON.parse(request1.responseText)}, function() {});
    }
  }

  if (tablink.substring(0,4) == 'http')
  {
    //first request for sagemaker classify
    var request = new XMLHttpRequest(); 
    // Open a new connection, use GET method on the api endpoint
    request.open('POST', 'https://3xe435ebm9.execute-api.us-east-2.amazonaws.com/Dev/classifyurl', true);
    var temp = '{"data": "'+tablink+'"}' //append url in a new variable for expected format
    var payload = JSON.parse(temp)
    var output = request.send(temp);

    //second request for dynamo user info pull
    var request2 = new XMLHttpRequest(); 
    request2.open('POST', 'https://agpgq1x878.execute-api.us-east-2.amazonaws.com/dev/userinfo', true);
    chrome.storage.local.get(['userId'], function(result) {
    var userName =  {
      uid: result.userId
    }
    //DONT CHANGE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    request2.send(JSON.stringify(userName));
    console.log(userName);
    }); //chrome storage get end

    //extension display stuff
    request2.onreadystatechange = function ()
    {
      var apiReturn = request2.responseText;
      chrome.storage.local.set({history: apiReturn},function(){});
    }
    
    request.onreadystatechange = function()
    {
      var out = request.responseText;
      out = JSON.parse(JSON.parse(out))
      var prob = out.prob
      if(prob[0] == 0)
      {
        prob = 50;
      }
      else
      {
        prob = Math.trunc(prob[0] * 100)
      }
      var party = out.label
      party = party[0]
      party = party.replace("__label__", "")
      var title = out.title
      var summary = out.summary
      var keywords = out.keywords

      if(party != null)
      {
        var tId = tab.id;
        chrome.storage.local.get(['userId'], function(result) {
          var data = {};
          data[tId] = {
            uid: result.userId,
            url: tablink,
            prob: prob,
            party: party,
            title: title,
            summary: summary,
            keywords: keywords
          };
        
          chrome.storage.local.set(data, function() {
            //console.log(data)
          });
          console.log('Sending to DB:' + data[tId]);
          if(prob == 50)
          {
            //No Party
          }
          else
          {
            let request4 = new XMLHttpRequest(); // initiate http request
            // Open a new connection, use GET method on the api endpoint
            request4.open('POST', 'https://3xe435ebm9.execute-api.us-east-2.amazonaws.com/Dev/put-dynamodb', true);
            let output4 = request4.send(JSON.stringify(data[tId]));
            request.onreadystatechange = function()
            {
              console.log("Done");
            }
          }
        });
      }

      var color = function(c,n,i,d){for(i=3;i--;c[i]=d<0?0:d>255?255:d|0)d=c[i]+n;return c}
      var r = 255;
      var g = 255;
      var b = 255;
      var opacity = 255;

      if(party == "Democrat" && prob > 50)
      {
        r = 25;
        g = 32;
        b = 102;
        opacity = (prob - 50) / 25
                      if(opacity >= 1)
                        opacity =  1;
                      opacity *= 255
        let c = color([r, g, b], 255 - opacity)
        c.push(255)
        chrome.browserAction.setBadgeBackgroundColor({
                color: c,
                tabId: tab.id
        })
        let outProb = ((prob - 50)) * 2
        chrome.browserAction.setBadgeText({
         text: outProb.toString(),
         tabId: tab.id
       })
      }

      if(party == "Republican" && prob > 50)
      {
        r = 233;
        g = 29;
        b = 14;
        opacity = (prob - 50) / 25
                      if(opacity >= 1)
                        opacity =  1;
                      opacity *= 255
        let d = color([r, g, b], 255 - opacity)
        d.push(255)
        chrome.browserAction.setBadgeBackgroundColor({
                color: d,
                tabId: tab.id
        })
        let outProb = ((prob - 50)) * 2
        chrome.browserAction.setBadgeText({
         text: outProb.toString(),
         tabId: tab.id
       })
      }
      if(prob == 50)
      {
        chrome.browserAction.setBadgeBackgroundColor({
                color: "black",
                tabId: tab.id
        })
        let outProb = 0;
        chrome.browserAction.setBadgeText({
         text: outProb.toString(),
         tabId: tab.id
       })
      }

    };
  }
});

chrome.tabs.onActiveChanged.addListener( function(tabId, info) {
    var windowId = info.windowId;
    //console.log(tabId)

    chrome.extension.onConnect.addListener(function(port) {
       console.log("Connected .....");
       port.onMessage.addListener(function(msg) {

       });
       port.postMessage(tabId);
    })
});
