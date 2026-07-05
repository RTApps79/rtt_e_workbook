import os
import pydicom # Make sure you have this installed: pip install pydicom

# --- YOU MUST CUSTOMIZE THESE TWO PATHS ---

# 1. LOCAL PATH TO YOUR DICOM SLICES FOLDER (on your PC)
# This is the FULL path to the folder that contains ALL the individual .dcm files
# for the specific series you want to list.
# EXAMPLE: If your repository is at C:\Users\kkind\my_dicom_project,
# and the DICOMs are deeply nested, it might look like this:
dicom_slices_folder = r"C:\Users\kkind\my_dicom_project\mediastinal_lymph_node_seg\case_0002\1.3.6.1.4.1.14519.5.2.1.261678860176247915184009743234524088493\CT_1.3.6.1.4.1.14519.5.2.1.273140215471692254985762569203840578735"
# Make sure to replace "C:\Users\kkind\my_dicom_project" with your actual project root.

# 2. WEB PATH PREFIX (relative to your index.html/JSON file on GitHub Pages)
# This is the path that starts from the ROOT of your GitHub repository
# (where index.html is located) and leads to the folder containing your .dcm files.
# Use forward slashes (/) for web paths.
# Based on your previous info, your index.html is at the root, and these DICOMs are:
web_path_prefix = "mediastinal_lymph_node_seg/case_0002/1.3.6.1.4.1.14519.5.2.1.261678860176247915184009743234524088493/CT_1.3.6.1.4.1.14519.5.2.1.273140215471692254985762569203840578735/"


# --- DO NOT EDIT BELOW THIS LINE UNLESS YOU KNOW WHAT YOU'RE DOING ---

dicom_file_paths = []
if os.path.exists(dicom_slices_folder):
    # Sort files to ensure correct slice order in the viewer
    for filename in sorted(os.listdir(dicom_slices_folder)):
        file_full_path = os.path.join(dicom_slices_folder, filename)
        if os.path.isfile(file_full_path) and filename.endswith(".dcm"):
            try:
                # Optional: Read with pydicom to confirm it's a valid DICOM
                # This makes the script slower but adds a robust check
                # pydicom.dcmread(file_full_path, force=True)

                # Add the relative web path for this file
                full_web_path = web_path_prefix + filename
                dicom_file_paths.append(f'"{full_web_path}"')
            except Exception as e:
                print(f"Warning: '{filename}' in '{dicom_slices_folder}' is not a valid DICOM or could not be read. Skipping. Error: {e}")
        elif os.path.isfile(file_full_path):
            print(f"Skipping non-DICOM file: {filename}")
else:
    print(f"Error: The local DICOM slices folder does not exist: {dicom_slices_folder}")
    print("Please check the 'dicom_slices_folder' variable in the script.")


# Print the JavaScript array format ready to copy-paste
print("\n--- Copy and Paste the following into your JSON or HTML code ---")
print("var imageUrls = [") # Or dicomUrls, depending on your target array name
for path in dicom_file_paths:
    print(f"    {path},")
print("];")
print("---------------------------------------------------------------")