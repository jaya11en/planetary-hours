import { type NextPage } from "next";
import { useState } from "react";

import { trpc } from "../utils/trpc";
const planetaryHours: NextPage = () => {
    const planetaryHours = trpc.planetary.get.useQuery({
        coefficient: 6
      });
    
      const [time, setTime] = useState<string>("15:55:25");
      const [isDay, setIsDay] = useState<boolean>(true);
    
      const todayDateOffset = new Date().getTimezoneOffset() * 60000;
      const today = (new Date(Date.now() - todayDateOffset)).toISOString().split('T')[0];
      const dateTime = new Date(today + "T" + time);
    
      const percentage = trpc.planetary.getPercentage.useQuery({
        time: time,
        isDay: isDay
      })
    
      return (
        <div>
        <form>
            <label>
              Time:
              <input type="text" name="name" />
            </label>
            <input type="submit" value="Submit" />
          </form>
          <div>{percentage.data?.percentage + "%"}</div>
          
        <div className="grid grid-cols-4 gap-4 content-around">
          
          {planetaryHours.data?.map((planetaryHour: any) => {
            return (
              <div className="max-w-sm rounded overflow-hidden shadow-lg" key={planetaryHour.hour[0]}>
                <div className={"px-6 py-4"}>
                  <div className={`font-bold text-xl mb-1 `}>{planetaryHour.hour.Name + " - " + planetaryHour.hour.Ruler}</div>
                  <div className={`text-gray-700 text-base mb-1 text-${planetaryHour.hour.Ruler.toLowerCase()}`}>{new Date(today + "T" +
                    planetaryHour.hour.Start).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true }) +
                    " - " +
                    new Date(today + "T" + planetaryHour.hour.End).toLocaleTimeString('en-US', {hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true })}
                  </div>
    
                  <div>
                    {planetaryHour.times.map((time: any) => {
                      return (
                        <p className={`text-gray-700 text-base ${time.style}`} key={time.percent}>
    
                          {time.percent + ": " + time.time}
                        </p>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })
          }
        </div>
        </div>
      )
}

export default planetaryHours;