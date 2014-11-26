R:

	Rscript -e "rmarkdown::render('data/snowfall-totals.Rmd')"
	open data/snowfall-totals.html

R_deploy:

	cp data/snowfall-totals.html /Volumes/www_html/multimedia/graphics/projectFiles/Rmd/
	rsync -rv data/snowfall-totals_files /Volumes/www_html/multimedia/graphics/projectFiles/Rmd
	open http://private.boston.com/multimedia/graphics/projectFiles/Rmd/snowfall-totals.html

css:

	cp node_modules/leaflet/dist/leaflet.css graphics/map/css/_leaflet.scss