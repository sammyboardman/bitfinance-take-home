__Installations__
* run ```npm i -g grenache-grape``` to install grenache globally
* Pull the repo and run ```npm install```

__Steps to Run__
* start up grape servers using the command 
```
grape --dp 20001 --aph 30001 --bn '127.0.0.1:20002 
grape --dp 20002 --aph 40001 --bn '127.0.0.1:20001'
```
* spin up multiple instances of the exchange service by running ```npm start``` in multiple terminals.
* This will trigger the exchange service by calling the mapperOrder function with different orders.
