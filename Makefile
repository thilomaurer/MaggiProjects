PHONY: install

install:
	npm install
	git checkout node_modules/ace-editor-builds/src-min-noconflict/theme-maggiui.js
	ln -sf /usr/lib64/libcurl.so.4 libcurl-gnutls.so.4
