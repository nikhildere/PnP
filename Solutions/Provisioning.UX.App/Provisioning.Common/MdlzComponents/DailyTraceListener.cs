using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Provisioning.Common.MdlzComponents
{
    public class DailyTraceListener : TraceListener
    {
        private string _LogFileLocation = "";
        private DateTime _CurrentDate;
        StreamWriter _TraceWriter;

        public DailyTraceListener(string FileName)
        {
            _LogFileLocation = FileName;
            _TraceWriter = new StreamWriter(GenerateFileName(), true);
        }

        public override void Write(string message)
        {
            WriteInternal(message);
        }

        public override void Write(string message, string category)
        {
            WriteInternal(category + " " + message);
        }

        public override void WriteLine(string message)
        {
            WriteInternal($"\r\n{DateTime.Now}##{Process.GetCurrentProcess().Id}##{Thread.CurrentThread.ManagedThreadId}##{message}");
        }

        public override void WriteLine(string message, string category)
        {
            WriteInternal($"\r\n{DateTime.Now}##{Process.GetCurrentProcess().Id}##{Thread.CurrentThread.ManagedThreadId}##{category}##{message}");
        }
        
        public override void Flush()
        {
            lock (this) if (_TraceWriter != null) _TraceWriter.Flush();
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing) _TraceWriter.Close();
        }

        private void WriteInternal(string message)
        {
            if (_CurrentDate.CompareTo(DateTime.Today) != 0)
            {
                _TraceWriter.Close();
                _TraceWriter = new StreamWriter(GenerateFileName(), true);
            }
            _TraceWriter.Write(message);
        }

        private string GenerateFileName()
        {
            _CurrentDate = DateTime.Today;
            string fn = Path.Combine(Path.GetDirectoryName(_LogFileLocation), _CurrentDate.ToString("yyyy"), _CurrentDate.ToString("MMMM"), Path.GetFileNameWithoutExtension(_LogFileLocation) + "_" + _CurrentDate.ToString("yyyyMMdd") + Path.GetExtension(_LogFileLocation));
            var d = Directory.CreateDirectory(Path.GetDirectoryName(fn));
            return fn;
        }

    }
}
