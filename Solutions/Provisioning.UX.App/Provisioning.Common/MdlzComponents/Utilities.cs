using Provisioning.Common.Utilities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Provisioning.Common.MdlzComponents
{
    public class MdlzUtilities
    {
        public static void PerformActionRetry(Action<string> a, Action preRetry = null, int retryAttempts = 5, int secondsToWaitBetweenEachAttempt = 0)
        {
            int i = 0;
            retryAttempts++;
            string exceptionMessage = string.Empty;

            while ((i) < retryAttempts)
            {
                if (i > 0)
                {
                    Log.Info("Provisioning.Common.MdlzComponents.MdlzUtilities.PerformActionRetry", "Retry Attempt: {0}. Wait seconds: {1}", i, secondsToWaitBetweenEachAttempt);
                    Thread.Sleep(TimeSpan.FromSeconds(secondsToWaitBetweenEachAttempt));
                    preRetry?.Invoke();
                }

                try
                {
                    a(exceptionMessage);
                    break;
                }
                catch (Exception ex)
                {
                    exceptionMessage = ex.ToString();
                    Log.Error("Provisioning.Common.MdlzComponents.MdlzUtilities.PerformActionRetry:Exception", exceptionMessage);
                    i++;
                    if (i == retryAttempts)
                        throw;
                }
            }

        }
    }
}
