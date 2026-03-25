import numpy as np
import pandas as pd
import csv
import itertools

picks = pd.read_csv("picks2019worldsbest.csv", index_col=0) #make sure to delete user name column
master = pd.read_csv("masterbracket8teams.csv", index_col=0)  #make the master bracket mannually to start, leaving unpicked games as -1

#winner = picks.index

seeds = master.iloc[2]
points = master.iloc[1]

#print(master)

pointa = np.array(points,dtype=long)
seeda = np.array(seeds,dtype=long)

bracket = 0

with open('scenario_pts_elite8_WB.csv', 'wb') as csvfile:
  wr = csv.writer(csvfile, quoting=csv.QUOTE_MINIMAL)
  output = master.columns.tolist()[48:]
  output = output + picks.index.tolist()
  wr.writerow(output)

  for scenario in itertools.product(range(2), repeat=7):  #change repeat and scenario array index to go from 0 to {games remaining}
    thiscase = master.iloc[0]
    #thiscase[48] = thiscase[48 - scenario[0] - 15]  # for Elite Eight games
    #thiscase[49] = thiscase[48 - scenario[1] - 13]
    #thiscase[50] = thiscase[48 - scenario[2] - 11]
    #thiscase[51] = thiscase[48 - scenario[3] - 9]
    #thiscase[52] = thiscase[48 - scenario[4] - 7]
    #thiscase[53] = thiscase[48 - scenario[5] - 5]
    #thiscase[54] = thiscase[48 - scenario[6] - 3]
    #thiscase[55] = thiscase[48 - scenario[7] - 1]

    thiscase[56] = thiscase[56 - scenario[0] - 7] #for Final Four Games
    thiscase[57] = thiscase[56 - scenario[1] - 5]
    thiscase[58] = thiscase[56 - scenario[2] - 3]
    thiscase[59] = thiscase[56 - scenario[3] - 1]

    thiscase[60] = thiscase[60 - scenario[4] - 3] # for National Semi Finals
    thiscase[61] = thiscase[60 - scenario[5] - 1]

    thiscase[62] = thiscase[62 - scenario[6] - 1] # for Championship
   

    for i in range(15):
      seeda[48 + i] = int(thiscase[48+i][:2])   #can't assign -1 to the seeda for some reason
    
    #print seeda
    #print picks.index    

    datarow = thiscase.tolist()[48:]
    #print datarow

    for entry in picks.index:
      #print picks.loc[entry]
      #print thiscase
      bracketpoints = sum((picks.loc[entry] == thiscase) * pointa) + sum((picks.loc[entry] == thiscase) * seeda)   #sumproduct of matching games for each entry
      datarow.append(bracketpoints)

    wr.writerow(datarow)


### OUTPUT should be: index = scenario number, columns = gamenumber + entry, values = game outcome + entry_points

csvfile.close()