hadoop fs -rm -r /output/*

spark-submit --packages com.databricks:spark-csv_2.10:1.4.0 --class TimeSeriesForecast ./arima-1.0-SNAPSHOT-jar-with-dependencies.jar 5
