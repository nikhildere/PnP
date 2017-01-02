using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Mondelez.SiteLifecycle.Common.Utilities
{
    public class TextFileUtility
    {
        public static string GetTextFromFile(out string strFilePath, string initialMessage = null, string fileNotFoundRetryMessage = null)
        {
            //Console.WriteLine(");
            initialMessage = initialMessage ?? "Provide full path of the file(each record on new line, NO column header(s), First column should have unique URLS):";
            fileNotFoundRetryMessage = fileNotFoundRetryMessage ?? "File not found please provide a valid path";
            Console.WriteLine(initialMessage);

            while (!File.Exists(strFilePath = Console.ReadLine().Trim('"')) && !strFilePath.StartsWith("http", StringComparison.CurrentCultureIgnoreCase))
            {
                //Console.WriteLine();
                Console.WriteLine(fileNotFoundRetryMessage);
            }

            if (strFilePath.StartsWith("http", StringComparison.CurrentCultureIgnoreCase))
            {
                return strFilePath;
            }

            string fileContent = null;

            using (StreamReader sr = new StreamReader(strFilePath))
            {
                fileContent = sr.ReadToEnd();
                sr.Close();
            }
            return fileContent;

        }

        public static string[] GetTextFromFileAndSplitNewLine(out string strFilePath, string initialMessage = null, string fileNotFoundRetryMessage = null)
        {
            return GetTextFromFile(out strFilePath, initialMessage, fileNotFoundRetryMessage).Split(new[] { Environment.NewLine }, StringSplitOptions.RemoveEmptyEntries);
        }

        public static void WriteTextToFile(string fullFileName, string content)
        {
            using (Stream s = new FileStream(fullFileName, FileMode.OpenOrCreate, FileAccess.ReadWrite))
            {
                using (StreamWriter sw = new StreamWriter(s))
                {
                    sw.Write(content);
                    sw.Flush();
                }
                s.Close();
            }
        }

        public static string GetFolderPath()
        {
            Console.WriteLine("Provide a folder path where the file should be saved: ");
            string filePath = Console.ReadLine();

            while (!Directory.Exists(filePath))
            {
                Console.WriteLine("Folder path does not exist. Provide another poath or create a folder at the mentioned path.");
                filePath = Console.ReadLine();
            }

            return filePath;
        }

        public static string GetFolderPath(string fullFilePath)
        {
            return (new FileInfo(fullFilePath)).DirectoryName;
        }
    }

}
