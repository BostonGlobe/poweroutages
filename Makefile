R:

	Rscript -e "rmarkdown::render('data/snowfall-totals.Rmd')"
	open data/snowfall-totals.html

R_deploy:

	cp data/snowfall-totals.html /Volumes/www_html/multimedia/graphics/projectFiles/Rmd/
	rsync -rv data/snowfall-totals_files /Volumes/www_html/multimedia/graphics/projectFiles/Rmd
	open http://private.boston.com/multimedia/graphics/projectFiles/Rmd/snowfall-totals.html

css:

	cp node_modules/leaflet/dist/leaflet.css graphics/map/css/_leaflet.scss

download:
	cd data; \
		rm -rf input; \
		mkdir input; \
		cd input; \
		curl http://wsgw.mass.gov/data/gispub/shape/state/towns.zip > towns.zip; \
		unzip towns.zip;

reproject:
	cd data; \
		rm -rf output; \
		mkdir output; \
		cd output; \
		ogr2ogr -select TOWN -s_srs EPSG:26986 -t_srs EPSG:4326 TOWNS.shp ../input/TOWNS_POLYM.shp; \
		topojson -p -o TOWNS.json --simplify-proportion 0.3 TOWNS.shp;