java -jar explorviz-analysis.jar &
java -jar explorviz-authentication.jar &
java -jar explorviz-discovery.jar &
java -jar explorviz-landscape.jar &
nginx -c nginx.conf
wait