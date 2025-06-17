#!/bin/sh

ALLURE_DIRECTORY="$PWD/allure-report"
ACCESSIBILITY_DIRECTORY="$PWD/reports"

echo "Publishing test results to S3"

if [ -n "$RESULTS_OUTPUT_S3_PATH" ]; then
   # Publish Allure reports
   if [ -d "$ALLURE_DIRECTORY" ]; then
      aws s3 cp --quiet "$ALLURE_DIRECTORY" "$RESULTS_OUTPUT_S3_PATH/allure-report" --recursive
      echo "Allure reports published to $RESULTS_OUTPUT_S3_PATH/allure-report"
   else
      echo "$ALLURE_DIRECTORY is not found"
   fi

   # Publish accessibility reports
   if [ -d "$ACCESSIBILITY_DIRECTORY" ]; then
      aws s3 cp --quiet "$ACCESSIBILITY_DIRECTORY" "$RESULTS_OUTPUT_S3_PATH/accessibility-reports" --recursive
      echo "Accessibility reports published to $RESULTS_OUTPUT_S3_PATH/accessibility-reports"
   else
      echo "$ACCESSIBILITY_DIRECTORY is not found"
   fi

   # Check if at least one directory was found
   if [ ! -d "$ALLURE_DIRECTORY" ] && [ ! -d "$ACCESSIBILITY_DIRECTORY" ]; then
      echo "No test reports found to publish"
      exit 1
   fi
else
   echo "RESULTS_OUTPUT_S3_PATH is not set"
   exit 1
fi
