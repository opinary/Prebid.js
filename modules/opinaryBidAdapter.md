# Overview

```
Module Name:  Opinary Bid Adapter
Module Type:  Bidder Adapter
Maintainer: prebid@opinary.com
```

# Description

Connects to Opinary for direct sponsored polls.

Opinary bid adapter supports Banner.

Currently only 500x500 is supported.

# Test Parameters
```
var adUnits = [
   {
      code: 'banner-div',
      mediaTypes: {
        banner: {
          sizes: [[500, 500]]
        }
      },
      bids: [{
         bidder: 'opinary',
         params: {
           customer: 'focus',
           sponsored: true,
           editorial: true
         }
       }]
   }
];
```
