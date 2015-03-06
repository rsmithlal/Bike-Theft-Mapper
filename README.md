# [Open Wi-Finder](http://openwifinder.com)
## Built for the Esri Canada Center of Excellence 2015 App Challenge
### *Robert Smith, Matt Kalebic, and Peck Sangiambut // McGill University*
—

#### **What it does:** 
*Open Wi-Finder was built to address the existing paucity of information regarding Wi-Fi access in Canadian cities. It employs a scalable, platform-independent approach and requires an existing connection for GPS functionality. The application serves two purposes:*

1. On the citizen-facing side of the application, users use their GPS location to either a) find a Wi-Fi hotspot nearby or b) contribute the location of a Wi-Fi hotspot. Each Wi-Fi hotspot will possess attribute information regarding SSID, whether or not it is free, and hours of accessibility. 
2. The Wi-Fi point locations, embedded with the aforementioned information, are available for download on the analytics side of the application. Governments and civic hackers can identify pockets and clusters of Wi-Fi access, overlay census tract data to conduct socioeconomic analyses within these areas, and formulate policies accordingly. 

We hope that Open Wi-Finder will allow for steps to be taken toward mending the digital divide caused by the confluence of cities and networked infrastructure. 

#### **How to use it:**
Simply go to the [Open Wi-Finder](http://openwifinder.com) website and start exploring -- we've taken care of the rest!

#### Utilizes:
* [ArcGIS API for Javascript](https://developers.arcgis.com/javascript/)
* [CodyHouse Full-Screen Pop-Out Navigation](http://codyhouse.co/gem/full-screen-pop-out-navigation/)
* [Firebase ](https://www.firebase.com) 


#### Roadmap:
* **Implement n-minute trade area method for delimitating hotspot coverage.** A walking time distance of fifteen minutes will be used to approximate access to each hotspot location.
* **Further develop analytics functionality.** Datasets containing all attribute information for hotspots will be available in JSON and CSV format. Clustering and heat maps will be implemented to visualize the flow of hotspots throughout a city. 
* **Introduce gamification to charter unexplored areas.** An objective-based system which rewards users for discovering free Wi-Fi hotspots is currently in the works. 
