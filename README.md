Configure httpd.conf:

...
Listen 5566
...
#DocumentRoot "C:/Program Files (x86)/Apache Software Foundation/Apache2.2/htdocs"
DocumentRoot "C:/media/"
...
<Directory />
    Options Indexes FollowSymLinks
    AllowOverride None
    Order deny,allow
    Allow from all
</Directory>

Configure index.html:

var photo_root = "../Pictures/";
